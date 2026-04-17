# Cincailah Setup Script

echo "🍛 Setting up Cincailah..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Creating from example..."
    cat > .env << EOL
# Database connection string for PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/cincailah?schema=public"

# Session secret (generate with: openssl rand -hex 32)
SESSION_SECRET="$(openssl rand -hex 32)"

# Node environment
NODE_ENV="development"
EOL
    echo "✅ Created .env file with generated SESSION_SECRET"
    echo "⚠️  IMPORTANT: Update DATABASE_URL in .env with your PostgreSQL credentials!"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update DATABASE_URL in .env with your PostgreSQL credentials"
echo "2. Run 'npx prisma db push' to create database tables"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🚀 Visit http://localhost:3000 to get started!"
