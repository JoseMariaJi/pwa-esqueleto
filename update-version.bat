node -e "require('fs').writeFileSync('version-actual.js', 'const APP_VERSION = \"' + new Date().toLocaleString() + '\"')"
git add .
git commit -m "Update PWA"
git push origin main