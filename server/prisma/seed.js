const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ShopSync database...\n');

  // Clear existing data
  await prisma.chatMessage.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();

  // Seed products — Prices in Indian Rupees (INR)
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Nike Air Max 270',
        price: 12740,
        originalPrice: 13589,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
        retailer: 'Nike',
        category: 'Sneakers',
        description: 'The Nike Air Max 270 delivers visible air under every step. Updated for modern comfort, the classic returns in fresh colorways.',
        isTracking: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Zara Essential Oversized T-Shirt',
        price: 3049,
        originalPrice: 3049,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600',
        retailer: 'Zara',
        category: 'T-Shirts',
        description: 'A clean, essential oversized tee crafted from premium cotton. Perfect for casual everyday looks or as a layering piece.',
        isTracking: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sony WH-1000XM5 Noise Canceling Headphones',
        price: 29556,
        originalPrice: 33802,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=600',
        retailer: 'Amazon',
        category: 'Electronics',
        description: 'Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life.',
        isTracking: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Classic Leather Chelsea Boots',
        price: 16052,
        originalPrice: 20808,
        image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=600',
        retailer: 'Nordstrom',
        category: 'Boots',
        description: 'Timeless Chelsea boots in genuine leather with elastic side panels. Versatile enough for both casual and semi-formal occasions.',
        isTracking: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Levi\'s 501 Original Fit Jeans',
        price: 5903,
        originalPrice: 6752,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600',
        retailer: 'Amazon',
        category: 'Jeans',
        description: 'The iconic straight-leg jean that started it all. Original fit with signature button fly and timeless style.',
        isTracking: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Minimal Analog Watch — Midnight',
        price: 19109,
        originalPrice: 19109,
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600',
        retailer: 'Nordstrom',
        category: 'Accessories',
        description: 'A sleek, minimalist analog watch with a matte black case and Italian leather strap. Pairs perfectly with any outfit.',
        isTracking: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Nike Dri-FIT Running Jacket',
        price: 7219,
        originalPrice: 9342,
        image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=600',
        retailer: 'Nike',
        category: 'Jackets',
        description: 'Lightweight and water-repellent running jacket with Dri-FIT technology. Reflective details keep you visible at night.',
        isTracking: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ray-Ban Aviator Classic Sunglasses',
        price: 13844,
        originalPrice: 13844,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600',
        retailer: 'Amazon',
        category: 'Accessories',
        description: 'The iconic Ray-Ban Aviator with gold metal frame and green crystal lenses. Originally designed for US aviators in 1937.',
        isTracking: false,
      },
    }),
  ]);

  // Seed initial AI greeting message
  await prisma.chatMessage.create({
    data: {
      sender: 'ai',
      text: "Hi there! 👋 I'm your ShopSync AI Stylist. I can help you find the perfect outfit for any occasion — whether it's a wedding, date night, work, or just everyday style. What are you looking for today?",
    },
  });

  console.log(`  ✅ Seeded ${products.length} products (INR prices)`);
  console.log(`  ✅ Added AI welcome message`);
  console.log('\n🎉 Database seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
