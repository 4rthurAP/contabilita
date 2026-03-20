import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(googleClientId);
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({
      $or: [{ email: dto.email.toLowerCase() }, { cpf: dto.cpf }],
    });
    if (existing) {
      throw new ConflictException('Email ou CPF ja cadastrado');
    }

    if (!this.isValidCpf(dto.cpf)) {
      throw new BadRequestException('CPF invalido');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Conta bloqueada por excesso de tentativas. Tente novamente em 15 minutos.',
      );
    }

    // Google-only users cannot login with email/password
    if (!user.password) {
      throw new UnauthorizedException('Use login com Google');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const update: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await this.userModel.updateOne({ _id: user._id }, update);
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userModel.updateOne(
        { _id: user._id },
        { failedLoginAttempts: 0, lockedUntil: null },
      );
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    // Compare hashed refresh token
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      // Possible token reuse attack — invalidate stored token
      await this.userModel.updateOne({ _id: user._id }, { refreshToken: null });
      throw new UnauthorizedException('Refresh token invalido');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, accessToken?: string) {
    await this.userModel.updateOne({ _id: userId }, { refreshToken: null });

    // Blacklist the access token so it can't be reused
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as any;
        if (decoded?.exp) {
          const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttlSeconds > 0) {
            await this.tokenBlacklistService.blacklist(accessToken, ttlSeconds);
          }
        }
      } catch {
        // Token decode failure is non-critical for logout
      }
    }
  }

  async googleAuth(idToken: string) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token Google invalido');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token Google invalido');
    }

    const { sub: googleId, email, name, picture } = payload;

    // Try to find by googleId first, then by email
    let user = await this.userModel.findOne({ googleId });
    if (!user) {
      user = await this.userModel.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link existing account with Google
        user.googleId = googleId!;
        user.authProvider = 'google';
        if (picture && !user.avatarUrl) {
          user.avatarUrl = picture;
        }
        await user.save();
      } else {
        // Create new Google user
        user = await this.userModel.create({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password: null,
          cpf: null,
          googleId,
          authProvider: 'google',
          avatarUrl: picture || null,
        });
      }
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }
    return user;
  }

  private async generateTokens(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.updateOne({ _id: userId }, { refreshToken: hashedToken });
  }

  private sanitizeUser(user: UserDocument) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      isSuperAdmin: user.isSuperAdmin,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
    };
  }

  /** Validacao de CPF com algoritmo de digitos verificadores */
  private isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    return remainder === parseInt(cpf[10]);
  }
}
