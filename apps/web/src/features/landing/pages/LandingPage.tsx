import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Users,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Calculator,
  Globe,
  Lock,
} from 'lucide-react';
import BlurText from '@/components/reactbits/BlurText';
import GradientText from '@/components/reactbits/GradientText';
import CountUp from '@/components/reactbits/CountUp';
import RotatingText from '@/components/reactbits/RotatingText';

/* ───────────────────────── Noise overlay ───────────────────────── */
function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 opacity-[0.03]"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/* ───────────────────────── Animated gradient orbs ───────────────── */
function GlowOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] motion-safe:animate-pulse" />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px] motion-safe:animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] rounded-full bg-indigo-600/6 blur-[140px] motion-safe:animate-pulse [animation-delay:4s]" />
    </div>
  );
}

/* ───────────────────────── Grid background ──────────────────────── */
function GridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }}
    />
  );
}

/* ───────────────────────── Navbar ────────────────────────────────── */
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Contabilita</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Recursos</a>
          <a href="#stats" className="hover:text-white transition-colors">Numeros</a>
          <a href="#modules" className="hover:text-white transition-colors">Modulos</a>
          <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
          >
            Comecar gratis
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ───────────────────────── Hero ──────────────────────────────────── */
function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <GlowOrbs />
      <GridBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400 backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span>Plataforma contabil completa para escritorios brasileiros</span>
        </div>

        <BlurText
          text="Contabilidade inteligente que transforma seu escritorio"
          as="h1"
          delay={80}
          animateBy="words"
          direction="bottom"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] justify-center mb-6"
        />

        <div className="flex items-center justify-center gap-3 text-xl sm:text-2xl md:text-3xl text-zinc-400 mb-8">
          <span>Automatize</span>
          <RotatingText
            texts={['Lancamentos', 'Apuracoes', 'Obrigacoes', 'Relatorios', 'Folha']}
            mainClassName="overflow-hidden text-white font-semibold"
            staggerFrom="last"
            staggerDuration={0.025}
            rotationInterval={2500}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          />
        </div>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-500 leading-relaxed">
          Do plano de contas ao LALUR, do Simples Nacional ao Lucro Real.
          Uma unica plataforma com tudo que seu escritorio precisa para
          entregar mais, com menos esforco.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="group flex items-center gap-2 px-8 py-3.5 text-base font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Comecar gratuitamente
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-8 py-3.5 text-base font-medium text-zinc-300 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Ver demonstracao
          </button>
        </div>

        {/* Fading bottom gradient */}
        <div className="mt-20 relative">
          <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-1 shadow-2xl">
            <div className="rounded-lg bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 sm:p-8">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Empresas', icon: Building2, color: 'text-blue-400' },
                  { label: 'Fiscal', icon: FileText, color: 'text-emerald-400' },
                  { label: 'Folha', icon: Users, color: 'text-violet-400' },
                ].map(({ label, icon: Icon, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-lg bg-white/5 p-4">
                    <Icon className={`h-6 w-6 ${color}`} />
                    <span className="text-xs text-zinc-400">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[85, 62, 94].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-600/40 to-violet-600/40" style={{ width: `${w}%` }} />
                    <span className="text-xs text-zinc-600 w-8">{w}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09090b] to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Stats ─────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: 2500, suffix: '+', label: 'Escritorios ativos', separator: '.' },
    { value: 180000, suffix: '+', label: 'Empresas gerenciadas', separator: '.' },
    { value: 99.9, suffix: '%', label: 'Uptime garantido', separator: '' },
    { value: 12, suffix: 'M+', label: 'Lancamentos/mes', separator: '.' },
  ];

  return (
    <section id="stats" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <CountUp
                  to={stat.value}
                  separator={stat.separator}
                  duration={2.5}
                  className="tabular-nums"
                />
                <span className="text-blue-400">{stat.suffix}</span>
              </div>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Features ──────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: BookOpen,
      title: 'Contabilidade Completa',
      description: 'Plano de contas, lancamentos, razao, balancete, balanco patrimonial e DRE. Tudo integrado e em tempo real.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      title: 'Escrita Fiscal Inteligente',
      description: 'Notas fiscais, apuracao automatica de impostos e geracao de guias. Simples Nacional, Lucro Presumido e Real.',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Users,
      title: 'Folha de Pagamento',
      description: 'Calculo automatico de folha, ferias, 13o, encargos. Integrado com a contabilidade e obrigacoes acessorias.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Shield,
      title: 'Seguranca & Auditoria',
      description: 'Controle de acesso granular (RBAC), trilha de auditoria completa e multi-tenancy com isolamento total.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: BarChart3,
      title: 'Relatorios & Analytics',
      description: 'Dashboards em tempo real, analise de custos por cliente, produtividade da equipe e fluxo de caixa.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Automacao Total',
      description: 'Eventos entre modulos, calculos automaticos, obrigacoes acessorias e alertas inteligentes de prazo.',
      gradient: 'from-yellow-500 to-amber-500',
    },
  ];

  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <GradientText
            colors={['#3b82f6', '#8b5cf6', '#6366f1', '#3b82f6']}
            animationSpeed={6}
            className="text-sm font-semibold uppercase tracking-widest mb-4"
          >
            Recursos poderosos
          </GradientText>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Tudo que seu escritorio precisa
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-500 text-lg">
            Modulos integrados que cobrem todo o ciclo contabil, fiscal e trabalhista
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-xl hover:shadow-blue-600/5"
            >
              <div className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Modules ───────────────────────────────── */
function ModulesSection() {
  const modules = [
    'Plano de Contas',
    'Lancamentos Contabeis',
    'Balancete & DRE',
    'Notas Fiscais (NF-e)',
    'Apuracao de Impostos',
    'Folha de Pagamento',
    'LALUR / Lucro Real',
    'Patrimonio (Ativo Fixo)',
    'Obrigacoes Acessorias',
    'Portal do Cliente',
    'Honorarios & Cobranca',
    'Apontamento de Horas',
    'Analise de Custos',
    'Busca NF-e (SEFAZ)',
    'Protocolo Digital',
    'Gestao de Tarefas',
  ];

  return (
    <section id="modules" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <GradientText
            colors={['#10b981', '#06b6d4', '#3b82f6', '#10b981']}
            animationSpeed={6}
            className="text-sm font-semibold uppercase tracking-widest mb-4"
          >
            Modulos completos
          </GradientText>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            16+ modulos integrados
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-500 text-lg">
            Cada modulo projetado para a realidade contabil brasileira
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {modules.map((mod) => (
            <div
              key={mod}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{mod}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Pricing ───────────────────────────────── */
function PricingSection() {
  const navigate = useNavigate();
  const plans = [
    {
      name: 'Starter',
      price: '297',
      description: 'Para escritorios que estao comecando',
      features: ['Ate 50 empresas', '3 usuarios', 'Contabilidade + Fiscal', 'Suporte por email'],
      cta: 'Comecar gratis',
      popular: false,
    },
    {
      name: 'Professional',
      price: '697',
      description: 'Para escritorios em crescimento',
      features: [
        'Ate 200 empresas',
        '10 usuarios',
        'Todos os modulos',
        'Portal do cliente',
        'Apontamento de horas',
        'Suporte prioritario',
      ],
      cta: 'Comecar agora',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Sob consulta',
      description: 'Para grandes escritorios e grupos',
      features: [
        'Empresas ilimitadas',
        'Usuarios ilimitados',
        'API completa',
        'SSO / SAML',
        'SLA garantido',
        'Gerente de conta dedicado',
      ],
      cta: 'Falar com vendas',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <GradientText
            colors={['#f59e0b', '#ef4444', '#ec4899', '#f59e0b']}
            animationSpeed={6}
            className="text-sm font-semibold uppercase tracking-widest mb-4"
          >
            Planos e precos
          </GradientText>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Escolha o plano ideal
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-500 text-lg">
            Todos os planos incluem 14 dias gratis. Sem cartao de credito.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                plan.popular
                  ? 'border-blue-500/30 bg-blue-600/5 shadow-xl shadow-blue-600/10 scale-[1.02]'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-1 text-xs font-medium text-white">
                  Mais popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">{plan.description}</p>
              <div className="mb-6">
                {plan.price !== 'Sob consulta' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-zinc-500">R$</span>
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-500">/mes</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20'
                    : 'border border-white/10 text-zinc-300 hover:bg-white/5'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Trust ─────────────────────────────────── */
function TrustSection() {
  const items = [
    { icon: Lock, text: 'Dados criptografados em repouso e em transito (AES-256)' },
    { icon: Globe, text: 'Infraestrutura em nuvem com replicas em 3 regioes' },
    { icon: Shield, text: 'LGPD compliant com DPO dedicado' },
    { icon: Calculator, text: 'Atualizacoes fiscais automaticas conforme legislacao' },
  ];

  return (
    <section className="relative py-20 border-t border-white/5">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-white/5 p-2">
                <Icon className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── CTA ───────────────────────────────────── */
function CtaSection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/8 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
          Pronto para transformar seu escritorio?
        </h2>
        <p className="mx-auto max-w-xl text-lg text-zinc-500 mb-10">
          Junte-se a milhares de escritorios que ja usam o Contabilita
          para simplificar sua rotina contabil.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="group inline-flex items-center gap-2 px-10 py-4 text-base font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          Comece seus 14 dias gratis
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <p className="mt-4 text-sm text-zinc-600">Sem cartao de credito. Cancele quando quiser.</p>
      </div>
    </section>
  );
}

/* ───────────────────────── Footer ────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-600">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-400">Contabilita</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <a href="#" className="hover:text-zinc-400 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Politica de Privacidade</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">LGPD</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Status</a>
          </div>
          <p className="text-xs text-zinc-700">
            &copy; {new Date().getFullYear()} Contabilita. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── Main Page ─────────────────────────────── */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-600/30">
      <NoiseOverlay />
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ModulesSection />
      <PricingSection />
      <TrustSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
