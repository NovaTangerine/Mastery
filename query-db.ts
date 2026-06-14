import { db } from './src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function run() {
  const q = query(collection(db, 'games'), where('title', '==', 'Zero Parades: For Dead Spies'));
  const snap = await getDocs(q);
  snap.forEach(doc => console.log(doc.data().coverUrl));
  process.exit(0);
}
run().catch(console.error);
