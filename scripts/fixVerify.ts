import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const User = require('../src/models/User').default;
  const res = await User.updateOne({ email: 'niteshyadav75614@yopmail.com' }, { isVerified: true });
  console.log('Updated:', res);
  process.exit(0);
});
