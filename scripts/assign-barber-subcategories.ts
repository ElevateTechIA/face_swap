import { getAdminFirestore } from '@/lib/firebase/admin';

const rules: { keywords: string[]; category: string }[] = [
  { keywords: ['skin fade', 'skin-fade', 'buzz', 'inked', 'shadow temple', 'razor'], category: 'skin-fade' },
  { keywords: ['fade', 'taper', 'blur', 'drop fade', 'lift fade'], category: 'fade' },
  { keywords: ['pompadour', 'slick', 'ivy', 'classic', 'prestige', 'gentleman', 'sweep', 'whisper', 'sleek', 'dandy', 'ripple'], category: 'classic-cut' },
  { keywords: ['beard', 'whisker', 'stubble'], category: 'beard' },
];

async function main() {
  const db = getAdminFirestore();
  const snap = await db.collection('templates').get();

  const barberDocs = snap.docs.filter(d => {
    const cats = d.data().categories || [];
    return cats.includes('barber-shop');
  });

  console.log('Processing', barberDocs.length, 'barber templates...\n');

  const batch = db.batch();
  let updated = 0;

  for (const doc of barberDocs) {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const current: string[] = data.categories || ['barber-shop'];

    let subCat: string | null = null;
    for (const rule of rules) {
      const matches = rule.keywords.some(kw => title.includes(kw));
      if (matches) {
        subCat = rule.category;
        break;
      }
    }

    if (subCat && !current.includes(subCat)) {
      const newCats = [...current, subCat];
      batch.update(doc.ref, { categories: newCats });
      console.log('✅', data.title, '→', subCat);
      updated++;
    } else {
      console.log('  ', data.title, '(barber-shop only)');
    }
  }

  await batch.commit();
  console.log('\nDone! Updated', updated, 'templates.');
}

main().catch(console.error);
