require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const SellerProfile = require('./models/SellerProfile');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Review = require('./models/Review');
const Blog = require('./models/Blog');
const Order = require('./models/Order');
const FlashSale = require('./models/FlashSale');
const slugify = require('slugify');

const generatedIds = { users: [], sellers: [], customers: [], categories: [], products: [] };

const CATEGORIES = [
  { name: 'Web Development', productType: 'video_course', description: 'Learn HTML, CSS, JavaScript, React, Node.js and more' },
  { name: 'Mobile Development', productType: 'video_course', description: 'iOS, Android, Flutter, React Native courses' },
  { name: 'Data Science', productType: 'video_course', description: 'Python, Machine Learning, AI, Data Analysis' },
  { name: 'Programming eBooks', productType: 'ebook', description: 'Digital books on programming and software engineering' },
  { name: 'Self Development', productType: 'ebook', description: 'Personal growth, productivity and mindset books' },
  { name: 'Fiction eBooks', productType: 'ebook', description: 'Bestselling fiction in digital format' },
  { name: 'Business & Finance', productType: 'ebook', description: 'Business strategy, investing and finance' },
  { name: 'Design & Creative', productType: 'video_course', description: 'Graphic design, UI/UX, video editing' },
  { name: 'Audiobooks', productType: 'audiobook', description: 'Listen to bestselling audiobooks' },
  { name: 'Software & Tools', productType: 'ebook', description: 'Productivity software and development tools' },
];

const SELLERS = [
  { name: 'TechGuru Academy', email: 'techguru@zalnio.com', phone: '+919000000001', storeName: 'TechGuru Academy', storeSlug: 'techguru-academy' },
  { name: 'CodeCraft Learning', email: 'codecraft@zalnio.com', phone: '+919000000002', storeName: 'CodeCraft Learning', storeSlug: 'codecraft-learning' },
  { name: 'SkillForge', email: 'skillforge@zalnio.com', phone: '+919000000003', storeName: 'SkillForge', storeSlug: 'skillforge' },
  { name: 'BookWorm Digital', email: 'bookworm@zalnio.com', phone: '+919000000004', storeName: 'BookWorm Digital', storeSlug: 'bookworm-digital' },
  { name: 'EduPrime', email: 'eduprime@zalnio.com', phone: '+919000000005', storeName: 'EduPrime', storeSlug: 'eduprime' },
  { name: 'DevMasters', email: 'devmasters@zalnio.com', phone: '+919000000006', storeName: 'DevMasters', storeSlug: 'devmasters' },
  { name: 'AudioBooks Hub', email: 'audiobooks@zalnio.com', phone: '+919000000007', storeName: 'AudioBooks Hub', storeSlug: 'audiobooks-hub' },
  { name: 'DesignPro Studio', email: 'designpro@zalnio.com', phone: '+919000000008', storeName: 'DesignPro Studio', storeSlug: 'designpro-studio' },
];

const CUSTOMERS = [
  { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+919100000001' },
  { name: 'Priya Patel', email: 'priya@example.com', phone: '+919100000002' },
  { name: 'Amit Singh', email: 'amit@example.com', phone: '+919100000003' },
  { name: 'Sneha Reddy', email: 'sneha@example.com', phone: '+919100000004' },
  { name: 'Vikram Joshi', email: 'vikram@example.com', phone: '+919100000005' },
  { name: 'Neha Kapoor', email: 'neha@example.com', phone: '+919100000006' },
  { name: 'Arun Kumar', email: 'arun@example.com', phone: '+919100000007' },
  { name: 'Divya Verma', email: 'divya@example.com', phone: '+919100000008' },
];

const PRODUCT_TEMPLATES = [
  { title: 'Complete React.js Masterclass', productType: 'video_course', sellerIdx: 0, catIdx: 0, price: 499, salePrice: 299, featured: true, bestSeller: true },
  { title: 'Node.js Backend Development', productType: 'video_course', sellerIdx: 1, catIdx: 0, price: 599, salePrice: 349, featured: true, bestSeller: true },
  { title: 'Python for Data Science', productType: 'video_course', sellerIdx: 2, catIdx: 2, price: 449, salePrice: 249, featured: true },
  { title: 'JavaScript: The Complete Guide', productType: 'video_course', sellerIdx: 0, catIdx: 0, price: 399, salePrice: 199, featured: true, bestSeller: true },
  { title: 'Flutter Mobile App Development', productType: 'video_course', sellerIdx: 5, catIdx: 1, price: 549, salePrice: 299, featured: true },
  { title: 'Machine Learning A-Z', productType: 'video_course', sellerIdx: 2, catIdx: 2, price: 699, salePrice: 399, bestSeller: true },
  { title: 'UI/UX Design Fundamentals', productType: 'video_course', sellerIdx: 7, catIdx: 7, price: 349, salePrice: 199 },
  { title: 'Advanced CSS & Sass', productType: 'video_course', sellerIdx: 5, catIdx: 0, price: 299, salePrice: 149, bestSeller: true },
  { title: 'Learning Python Programming', productType: 'video_course', sellerIdx: 1, catIdx: 2, price: 399, salePrice: 199 },
  { title: 'React Native for Beginners', productType: 'video_course', sellerIdx: 5, catIdx: 1, price: 499, salePrice: 249 },
  { title: 'Clean Code: A Handbook', productType: 'ebook', sellerIdx: 3, catIdx: 3, price: 299, salePrice: 149, featured: true, bestSeller: true },
  { title: 'Atomic Habits', productType: 'ebook', sellerIdx: 3, catIdx: 4, price: 249, salePrice: 99, featured: true, bestSeller: true },
  { title: 'The Alchemist', productType: 'ebook', sellerIdx: 3, catIdx: 5, price: 199, salePrice: 99, bestSeller: true },
  { title: 'Rich Dad Poor Dad', productType: 'ebook', sellerIdx: 4, catIdx: 6, price: 199, salePrice: 79, featured: true },
  { title: 'Think Like a Monk', productType: 'ebook', sellerIdx: 3, catIdx: 4, price: 179, salePrice: 99 },
  { title: 'The Psychology of Money', productType: 'ebook', sellerIdx: 4, catIdx: 6, price: 249, salePrice: 99, bestSeller: true },
  { title: 'The Great Gatsby', productType: 'ebook', sellerIdx: 3, catIdx: 5, price: 149, salePrice: 59 },
  { title: 'Deep Work', productType: 'ebook', sellerIdx: 4, catIdx: 4, price: 229, salePrice: 129 },
  { title: 'The Lean Startup', productType: 'ebook', sellerIdx: 4, catIdx: 6, price: 279, salePrice: 149 },
  { title: 'Introduction to Algorithms', productType: 'ebook', sellerIdx: 3, catIdx: 3, price: 499, salePrice: 249 },
  { title: 'The 48 Laws of Power (Audio)', productType: 'audiobook', sellerIdx: 6, catIdx: 8, price: 199, salePrice: 99, featured: true },
  { title: 'Atomic Habits (Audio)', productType: 'audiobook', sellerIdx: 6, catIdx: 8, price: 249, salePrice: 129, bestSeller: true },
  { title: 'Can\'t Hurt Me (Audio)', productType: 'audiobook', sellerIdx: 6, catIdx: 8, price: 299, salePrice: 149 },
  { title: 'VS Code Pro Kit', productType: 'ebook_combo', sellerIdx: 1, catIdx: 9, price: 99, salePrice: 49, featured: true },
  { title: 'Git GUI Tool', productType: 'ebook_combo', sellerIdx: 5, catIdx: 9, price: 149, salePrice: 79 },
  { title: 'Portfolio Website Template', productType: 'video_course', sellerIdx: 7, catIdx: 7, price: 199, salePrice: 99, bestSeller: true },
  { title: 'E-commerce React Template', productType: 'video_course', sellerIdx: 7, catIdx: 7, price: 299, salePrice: 149 },
  { title: 'Figma UI Kit Bundle', productType: 'ebook_combo', sellerIdx: 2, catIdx: 7, price: 249, salePrice: 99 },
];

const REVIEW_TEMPLATES = [
  { rating: 5, comment: 'Absolutely fantastic course! The instructor explains everything so clearly. I went from absolute beginner to building my own apps.' },
  { rating: 5, comment: 'This was exactly what I needed. Practical, well-structured, and easy to follow. Highly recommend to anyone starting out.' },
  { rating: 4, comment: 'Great content with real-world examples. A few sections could use more depth, but overall an excellent resource.' },
  { rating: 5, comment: 'Life-changing book! The concepts shared here have completely transformed my daily routine and productivity.' },
  { rating: 4, comment: 'Well written and insightful. The author does a great job of breaking down complex topics into digestible chapters.' },
  { rating: 5, comment: 'Best investment I\'ve made for my career. The skills I learned helped me land a job in tech.' },
  { rating: 4, comment: 'Good quality audio production and the narrator has a pleasant voice. The content is engaging throughout.' },
  { rating: 5, comment: 'I have bought multiple courses from this platform and this one is by far the best. Worth every penny!' },
  { rating: 3, comment: 'Decent content but expected more hands-on exercises. Good for getting a high-level overview.' },
  { rating: 5, comment: 'The instructor is very knowledgeable and responsive to questions. The projects were fun to build.' },
  { rating: 4, comment: 'Clear explanations and great examples. Would love to see an advanced follow-up course.' },
  { rating: 5, comment: 'I recommended this to all my colleagues. The practical approach makes learning so much easier.' },
];

const BLOG_TEMPLATES = [
  {
    title: 'Top 10 Web Development Trends in 2026',
    excerpt: 'Stay ahead of the curve with these emerging web development trends shaping the digital landscape this year.',
    content: 'The web development landscape continues to evolve at a rapid pace. In 2026, we are seeing several key trends that every developer should be aware of...\n\n1. AI-Powered Development Tools\nAI-assisted coding has become mainstream, with tools like GitHub Copilot and others becoming essential parts of the developer workflow.\n\n2. WebAssembly Gains Momentum\nWebAssembly is enabling near-native performance for web applications, opening up new possibilities for complex applications.\n\n3. Edge Computing\nProcessing data closer to users is reducing latency and improving user experiences significantly.\n\n4. Progressive Web Apps\nPWAs continue to blur the line between web and native apps, offering offline capabilities and app-like experiences.\n\n5. Serverless Architecture\nMore developers are adopting serverless to reduce operational complexity and costs.\n\nStay tuned for more insights and deep dives into each of these topics!',
    category: 'Web Development',
    tags: ['web-development', 'trends', 'technology'],
    readTimeMinutes: 8,
  },
  {
    title: 'How to Start Learning Data Science in 2026',
    excerpt: 'A complete roadmap for beginners looking to break into the data science field with practical steps and resources.',
    content: 'Data science continues to be one of the most in-demand fields in technology. Here is your comprehensive guide to getting started...\n\nStep 1: Learn Python\nPython is the lingua franca of data science. Start with basics, then move to pandas, numpy, and matplotlib.\n\nStep 2: Statistics & Mathematics\nUnderstanding probability, statistics, and linear algebra is crucial for data analysis.\n\nStep 3: Databases & SQL\nData lives in databases. Mastering SQL is non-negotiable for any data professional.\n\nStep 4: Machine Learning\nStart with scikit-learn for classical ML, then dive into deep learning with TensorFlow or PyTorch.\n\nStep 5: Real Projects\nBuild a portfolio with real datasets from Kaggle or public sources.\n\nRemember: consistency beats intensity. Practice a little every day!',
    category: 'Data Science',
    tags: ['data-science', 'python', 'machine-learning', 'career'],
    readTimeMinutes: 10,
  },
  {
    title: 'The Ultimate Guide to Digital Product Creation',
    excerpt: 'Learn how to create, market, and sell digital products that generate passive income.',
    content: 'Digital products offer an incredible opportunity to create passive income. Here is everything you need to know...\n\nTypes of Digital Products\n- eBooks: Share your knowledge in an easily digestible format\n- Online Courses: Package your expertise into structured learning\n- Templates: Help others save time with ready-to-use designs\n- Software: Build tools that solve specific problems\n\nFinding Your Niche\nThe key to success is finding the intersection of your expertise and market demand.\n\nCreating Your First Product\nStart small. Create a minimum viable product and iterate based on feedback.\n\nMarketing Strategies\nBuild an email list, leverage social media, and consider partnerships with influencers in your niche.\n\nStart your digital product journey today and join thousands of successful creators on Zalnio!',
    category: 'Business',
    tags: ['digital-products', 'passive-income', 'entrepreneurship'],
    readTimeMinutes: 7,
  },
  {
    title: 'Flutter vs React Native: Which Should You Learn?',
    excerpt: 'An in-depth comparison of the two leading cross-platform mobile development frameworks to help you decide.',
    content: 'Choosing between Flutter and React Native is one of the most common dilemmas for aspiring mobile developers...\n\nFlutter\n- Language: Dart\n- Performance: Near-native\n- UI: Widget-based, highly customizable\n- Learning Curve: Moderate\n- Best For: Complex UI, consistency across platforms\n\nReact Native\n- Language: JavaScript/TypeScript\n- Performance: Good (with native modules)\n- UI: Native components\n- Learning Curve: Gentle (if you know React)\n- Best For: Rapid development, large community\n\nVerdict\nBoth are excellent choices. Flutter offers better performance and UI consistency, while React Native has a larger community and easier learning curve for web developers.\n\nOur platform has excellent courses for both technologies. Check them out in our Learning Center!',
    category: 'Mobile Development',
    tags: ['flutter', 'react-native', 'mobile-development', 'comparison'],
    readTimeMinutes: 6,
  },
  {
    title: '5 Books That Will Transform Your Mindset',
    excerpt: 'These five books have helped thousands of readers shift their perspective and achieve more in life.',
    content: 'The right book at the right time can change everything. Here are five books that have transformed millions of lives...\n\n1. Atomic Habits by James Clear\nTiny changes, remarkable results. Learn how small habits compound into extraordinary outcomes.\n\n2. Think Like a Monk by Jay Shetty\nTrain your mind for peace and purpose by applying ancient wisdom to modern life.\n\n3. The Psychology of Money by Morgan Housel\nUnderstanding your relationship with money is the first step to financial freedom.\n\n4. Deep Work by Cal Newport\nIn a world of distractions, the ability to focus deeply is becoming a superpower.\n\n5. Can\'t Hurt Me by David Goggins\nPush past your perceived limits and unlock your full potential through mental toughness.\n\nAll these books are available as eBooks and audiobooks on Zalnio!',
    category: 'Self Development',
    tags: ['books', 'mindset', 'self-development', 'motivation'],
    readTimeMinutes: 9,
  },
];

function makeSlug(text) {
  return slugify(text, { lower: true, strict: true });
}

async function seedAll() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const skipDrop = ['users', 'sellerprofiles', 'products', 'categories', 'reviews', 'blogs', 'orders', 'flashsales'];
    for (const name of skipDrop) {
      if (collectionNames.includes(name)) {
        await db.collection(name).deleteMany({});
        console.log(`Cleared collection: ${name}`);
      }
    }

    // 1. Create Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@zalnio.com',
      phone: '+919999999999',
      password: 'Admin@1234',
      role: 'admin',
      isActive: true,
      isVerified: true,
      isPhoneVerified: true,
      metadata: { accountType: 'email' },
    });
    console.log(`Admin created: admin@zalnio.com / Admin@1234`);

    // 2. Create Categories
    const categoryDocs = await Category.insertMany(
      CATEGORIES.map(c => ({
        name: c.name,
        slug: makeSlug(c.name),
        description: c.description,
        productType: c.productType,
        isActive: true,
        isFeatured: true,
        displayOrder: 0,
      }))
    );
    console.log(`${categoryDocs.length} categories created`);

    // 3. Create Seller Users
    const sellerUserDocs = [];
    for (const s of SELLERS) {
      const user = await User.create({
        name: s.name,
        email: s.email,
        phone: s.phone,
        password: 'Seller@1234',
        role: 'seller',
        isActive: true,
        isVerified: true,
        isPhoneVerified: true,
        isSellerApproved: true,
        sellerStatus: 'approved',
        sellerApprovedAt: new Date(),
      });
      sellerUserDocs.push(user);
      console.log(`Seller user created: ${s.email} / Seller@1234`);
    }

    // 4. Create Seller Profiles
    const sellerProfileDocs = [];
    for (let i = 0; i < SELLERS.length; i++) {
      const s = SELLERS[i];
      const profile = await SellerProfile.create({
        user: sellerUserDocs[i]._id,
        storeName: s.storeName,
        storeSlug: s.storeSlug,
        storeDescription: `Official store of ${s.storeName}. Quality digital products and courses.`,
        contactEmail: s.email,
        contactPhone: s.phone,
        verificationStatus: 'verified',
        isActive: true,
        isFeatured: true,
        rating: +(4 + Math.random()).toFixed(1),
        totalRatings: Math.floor(Math.random() * 500) + 50,
        bankDetails: {
          accountHolderName: s.name,
          accountNumber: 'XXXXXXXXXX' + String(Math.floor(1000 + Math.random() * 9000)),
          ifscCode: 'HDFC000' + String(Math.floor(1000 + Math.random() * 9000)),
          bankName: 'HDFC Bank',
        },
        businessAddress: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India',
        },
      });
      sellerProfileDocs.push(profile);
    }
    console.log(`${sellerProfileDocs.length} seller profiles created`);

    // 5. Create Customer Users
    const customerDocs = [];
    for (const c of CUSTOMERS) {
      const user = await User.create({
        name: c.name,
        email: c.email,
        phone: c.phone,
        password: 'Customer@1234',
        role: 'customer',
        isActive: true,
        isVerified: true,
        isPhoneVerified: true,
        metadata: { accountType: 'email' },
      });
      customerDocs.push(user);
    }
    console.log(`${customerDocs.length} customer users created`);

    // 6. Create Products
    const productDocs = [];
    for (const tpl of PRODUCT_TEMPLATES) {
      const sellerUser = sellerUserDocs[tpl.sellerIdx];
      const category = categoryDocs[tpl.catIdx];
      const slug = makeSlug(tpl.title) + '-' + Date.now() + String(Math.random()).slice(2, 6);

      const images = [];
      if (tpl.productType === 'video_course') {
        images.push({ url: `https://picsum.photos/seed/${slug}/400/300`, isPrimary: true });
      } else if (tpl.productType === 'ebook') {
        images.push({ url: `https://picsum.photos/seed/${slug}/200/300`, isPrimary: true });
      } else if (tpl.productType === 'audiobook') {
        images.push({ url: `https://picsum.photos/seed/${slug}/400/400`, isPrimary: true });
      } else {
        images.push({ url: `https://picsum.photos/seed/${slug}/400/300`, isPrimary: true });
      }

      const product = await Product.create({
        seller: sellerUser._id,
        title: tpl.title,
        slug,
        description: `This is a comprehensive ${tpl.productType} titled "${tpl.title}". It covers all the essential topics with practical examples and hands-on projects. Perfect for beginners and intermediate learners alike.`,
        shortDescription: `Learn ${tpl.title} with expert guidance.`,
        productType: tpl.productType,
        category: category._id,
        tags: [tpl.productType, category.name.toLowerCase().replace(/\s+/g, '-'), 'popular'],
        images,
        pricing: {
          originalPrice: tpl.price,
          sellingPrice: tpl.salePrice,
          discount: Math.round(((tpl.price - tpl.salePrice) / tpl.price) * 100),
          discountType: 'percentage',
          priceHistory: [{ price: tpl.salePrice, effectiveDate: new Date() }],
        },
        inventory: {
          quantity: 999,
          trackInventory: false,
        },
        ratings: {
          average: +(3.5 + Math.random() * 1.5).toFixed(1),
          count: Math.floor(Math.random() * 200) + 10,
          distribution: { 1: 2, 2: 3, 3: 8, 4: 15, 5: 12 },
        },
        sales: {
          count: Math.floor(Math.random() * 300) + 10,
          revenue: (tpl.salePrice * (Math.floor(Math.random() * 300) + 10)),
        },
        settings: {
          isFeatured: tpl.featured || false,
          isBestSeller: tpl.bestSeller || false,
          isNewArrival: true,
          isDownloadable: true,
        },
        status: 'published',
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        viewCount: Math.floor(Math.random() * 5000) + 100,
        wishlistCount: Math.floor(Math.random() * 100) + 5,
        digitalFile: {
          fileType: tpl.productType === 'video_course' ? 'mp4' : tpl.productType === 'ebook' ? 'pdf' : tpl.productType === 'audiobook' ? 'mp3' : 'zip',
          fileSize: Math.floor(Math.random() * 2000) + 100,
          fileUrl: 'https://example.com/sample',
          isDownloadable: true,
        },
        ...(tpl.productType === 'video_course' ? {
          digitalFile: {
            fileType: 'mp4',
            fileSize: Math.floor(Math.random() * 5000) + 500,
            fileUrl: 'https://example.com/course-sample',
            duration: Math.floor(Math.random() * 20) + 2,
            isDownloadable: true,
          },
        } : {}),
      });

      productDocs.push(product);
    }
    console.log(`${productDocs.length} products created`);

    // 7. Create Orders (to give sales a realistic feel)
    const orderItems = productDocs.slice(0, 15).map(product => ({
      product: product._id,
      seller: product.seller,
      title: product.title,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: product.pricing.sellingPrice,
      total: product.pricing.sellingPrice * (Math.floor(Math.random() * 3) + 1),
      status: 'delivered',
    }));

    const orderPromises = [];
    for (let i = 0; i < 20; i++) {
      const customer = customerDocs[i % customerDocs.length];
      const item = orderItems[i % orderItems.length];
      if (!item) continue;
      orderPromises.push(Order.create({
        orderNumber: `ZLN-SEED-${Date.now()}-${i}`,
        user: customer._id,
        items: [item],
        pricing: {
          subtotal: item.total,
          total: item.total,
        },
        payment: {
          method: 'razorpay',
          status: 'captured',
        },
        status: 'delivered',
        isDigitalOnly: true,
        shippingAddress: {
          fullName: customer.name,
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India',
        },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
      }));
    }
    const orders = await Promise.all(orderPromises);
    console.log(`${orders.length} orders created`);

    // 8. Create Reviews
    const reviewPromises = [];
    for (let i = 0; i < REVIEW_TEMPLATES.length; i++) {
      const rt = REVIEW_TEMPLATES[i];
      const product = productDocs[i % productDocs.length];
      const user = customerDocs[i % customerDocs.length];
      const order = orders[i % orders.length];
      reviewPromises.push(Review.create({
        product: product._id,
        user: user._id,
        order: order._id,
        rating: rt.rating,
        comment: rt.comment,
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: Math.floor(Math.random() * 50),
      }));
    }
    const reviews = await Promise.all(reviewPromises);
    console.log(`${reviews.length} reviews created`);

    // 9. Create Blog Posts
    const blogPromises = BLOG_TEMPLATES.map(b => Blog.create({
      title: b.title,
      slug: makeSlug(b.title),
      excerpt: b.excerpt,
      content: b.content,
      author: admin._id,
      category: b.category,
      tags: b.tags,
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
      readTimeMinutes: b.readTimeMinutes,
      viewCount: Math.floor(Math.random() * 500) + 50,
    }));
    const blogs = await Promise.all(blogPromises);
    console.log(`${blogs.length} blog posts created`);

    // 10. Create Flash Sale
    const flashSaleProducts = productDocs.slice(0, 5).map(p => ({
      product: p._id,
      salePrice: +(p.pricing.sellingPrice * 0.6).toFixed(0),
      discountPercent: 40,
      quantity: 50,
      sold: Math.floor(Math.random() * 30),
      maxPerUser: 2,
    }));

    await FlashSale.create({
      title: 'Weekend Mega Sale',
      slug: 'weekend-mega-sale-' + Date.now(),
      description: 'Flat 40% off on top courses and eBooks! Limited time offer.',
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: true,
      products: flashSaleProducts,
      createdBy: admin._id,
    });
    console.log('Flash sale created');

    console.log('\n=== SEED COMPLETED SUCCESSFULLY ===');
    console.log('Login Credentials:');
    console.log('  Admin:    admin@zalnio.com / Admin@1234');
    console.log('  Seller:   techguru@zalnio.com / Seller@1234');
    console.log('  Customer: rahul@example.com / Customer@1234');

  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedAll();
