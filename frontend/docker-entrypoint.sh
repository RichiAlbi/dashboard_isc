#!/bin/sh

# Generate runtime config with environment variables
# This allows runtime configuration without rebuilding the image

cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8000/api/v1}",
  VITE_ENCRYPTION_KEY: "${VITE_ENCRYPTION_KEY:-}"
};
EOF

echo "Runtime config generated:"
echo "  - API URL: ${VITE_API_BASE_URL:-http://localhost:8000/api/v1}"
echo "  - Encryption: ${VITE_ENCRYPTION_KEY:+enabled}"

# Start nginx
exec nginx -g 'daemon off;'
