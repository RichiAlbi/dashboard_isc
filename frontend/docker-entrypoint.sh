#!/bin/sh

# Replace placeholder in config.js with actual environment variable
# This allows runtime configuration of the API URL

cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8000/api/v1}"
};
EOF

echo "Runtime config generated with API URL: ${VITE_API_BASE_URL:-http://localhost:8000/api/v1}"

# Start nginx
exec nginx -g 'daemon off;'
