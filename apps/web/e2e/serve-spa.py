"""Simple SPA-aware static file server for E2E tests."""
import http.server
import mimetypes
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist')

# Ensure correct MIME types for modern web assets
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        # Serve file if it exists, otherwise fall back to index.html (SPA routing)
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            return super().do_GET()
        # Fall back to index.html for client-side routing
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        pass  # Suppress logs during tests


if __name__ == '__main__':
    with http.server.HTTPServer(('127.0.0.1', PORT), SPAHandler) as httpd:
        print(f'SPA server running at http://127.0.0.1:{PORT}')
        httpd.serve_forever()
