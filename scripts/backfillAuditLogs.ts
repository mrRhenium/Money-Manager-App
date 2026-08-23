import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const typeMap: Record<string, string> = {
  "transaction": "Transaction",
  "category": "Category",
  "account": "Account",
  "budget": "Budget",
  "recurringbill": "RecurringBill",
  "loan": "Loan",
  "investment": "Investment",
  "insurance": "InsurancePolicy",
  "goal": "Goal",
  "person": "Person",
  "creditcard": "CreditCard"
};

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const AuditLog = require('../src/models/AuditLog').default;
  // load models
  require('../src/models/Transaction');
  require('../src/models/Category');
  require('../src/models/Account');
  require('../src/models/Budget');
  require('../src/models/RecurringBill');
  require('../src/models/Loan');
  require('../src/models/Investment');
  require('../src/models/InsurancePolicy');
  require('../src/models/Goal');
  require('../src/models/Person');
  require('../src/models/CreditCard');

  const logs = await AuditLog.find({ entityName: { $exists: false } });
  console.log(`Found ${logs.length} logs missing entityName`);

  let count = 0;
  for (const log of logs) {
    if (!log.entityId || !mongoose.Types.ObjectId.isValid(log.entityId)) continue;
    const modelName = typeMap[log.entityType.toLowerCase()] || log.entityType;
    const Model = mongoose.models[modelName];
    if (Model) {
      const doc = await Model.findById(log.entityId).lean();
      if (doc) {
        log.entityName = doc.name || doc.title || doc.policyName || doc.cardName || doc.bankName || doc.note || doc.description || modelName;
        await log.save();
        count++;
      }
    }
  }

  console.log(`Updated ${count} logs`);
  process.exit(0);
});
