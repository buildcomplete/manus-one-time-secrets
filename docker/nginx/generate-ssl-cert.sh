# Self-signed SSL certificate generation script
# Run this script to generate self-signed certificates for development

mkdir -p ssl
cd ssl

# Generate private key
openssl genrsa -out privkey.pem 2048

# Generate self-signed certificate
openssl req -new -x509 -key privkey.pem -out fullchain.pem -days 365 -subj "/CN=localhost" -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"

echo "Self-signed SSL certificates generated in the ssl directory."
echo "For production, replace these with real certificates from a certificate authority."
