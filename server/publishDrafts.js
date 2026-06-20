require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  const productSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.model('Product', productSchema, 'products');

  const digitalTypes = ['ebook', 'audiobook', 'video_course', 'course_bundle', 'software', 'template', 'subscription'];
  
  const result = await Product.updateMany(
    { productType: { $in: digitalTypes }, 'inventory.trackInventory': true },
    { $set: { 'inventory.trackInventory': false, 'inventory.quantity': 99999 } }
  );
  
  console.log('Fixed inventory for', result.modifiedCount, 'digital products');
  
  const physicalResult = await Product.updateMany(
    { productType: { $nin: digitalTypes }, 'inventory.quantity': { $lte: 0 } },
    { $set: { 'inventory.quantity': 10 } }
  );
  
  console.log('Fixed inventory for', physicalResult.modifiedCount, 'physical products');
  
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
