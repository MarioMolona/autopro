import { createClient } from '@supabase/supabase-js';
import { MOCK_USERS, MOCK_LABELS, MOCK_COLUMNS, MOCK_CARDS, MOCK_COMMENTS, MOCK_NOTIFICATIONS } from './src/data/mockData.js';

const supabaseUrl = 'https://kfxnpnwpdgdswvywjnhu.supabase.co';
const supabaseKey = 'sb_publishable_17WECf0vg2z6g1ltPuGkHw_WKyjKRkn';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding users...');
  const { error: usersError } = await supabase.from('users').upsert(MOCK_USERS);
  if (usersError) console.error('Users error:', usersError);

  console.log('Seeding labels...');
  const { error: labelsError } = await supabase.from('labels').upsert(MOCK_LABELS);
  if (labelsError) console.error('Labels error:', labelsError);

  console.log('Seeding columns...');
  const { error: columnsError } = await supabase.from('columns').upsert(MOCK_COLUMNS);
  if (columnsError) console.error('Columns error:', columnsError);

  console.log('Seeding cards...');
  // exclude arrays from cards
  const cleanCards = MOCK_CARDS.map(c => {
    const { assignees, labels, ...rest } = c;
    if (rest.dueDate === null) delete rest.dueDate;
    return rest;
  });
  const { error: cardsError } = await supabase.from('cards').upsert(cleanCards);
  if (cardsError) console.error('Cards error:', cardsError);

  console.log('Seeding card relationships...');
  const cardAssignees = [];
  const cardLabels = [];
  MOCK_CARDS.forEach(c => {
    if (c.assignees) c.assignees.forEach(u => cardAssignees.push({ cardId: c.id, userId: u }));
    if (c.labels) c.labels.forEach(l => cardLabels.push({ cardId: c.id, labelId: l }));
  });
  
  const { error: caError } = await supabase.from('card_assignees').upsert(cardAssignees);
  if (caError) console.error('Card assignees error:', caError);

  const { error: clError } = await supabase.from('card_labels').upsert(cardLabels);
  if (clError) console.error('Card labels error:', clError);

  console.log('Seeding comments...');
  const { error: commentsError } = await supabase.from('comments').upsert(MOCK_COMMENTS);
  if (commentsError) console.error('Comments error:', commentsError);

  console.log('Seeding notifications...');
  const { error: notifError } = await supabase.from('notifications').upsert(MOCK_NOTIFICATIONS);
  if (notifError) console.error('Notifications error:', notifError);

  console.log('Seeding complete.');
}

seed().catch(console.error);
