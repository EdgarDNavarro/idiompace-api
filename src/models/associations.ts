// associations.ts
// Centralización de todas las asociaciones entre modelos para evitar dependencias circulares en ESM

import Story from './Story.Model.js';
import Exercise from './Exercise.Model.js';
import Vocabulary from './Vocabulary.Model.js';
import Decks from './Decks.Model.js';
import Flashcards from './Flashcards.Model.js';

// Story ↔ Exercise
Story.hasMany(Exercise, {
  foreignKey: 'storyId',
  as: 'exercises',
});
Exercise.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story',
});

// Story ↔ Vocabulary
Story.hasMany(Vocabulary, {
  foreignKey: 'storyId',
  as: 'vocabularies',
});
Vocabulary.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story',
});

// Decks ↔ Flashcards
Decks.hasMany(Flashcards, {
  foreignKey: 'deckId',
  as: 'flashcards',
  onDelete: 'CASCADE',
  hooks: true,
});
Flashcards.belongsTo(Decks, {
  foreignKey: 'deckId',
  as: 'deck',
});

export default {
  Story,
  Exercise,
  Vocabulary,
  Decks,
  Flashcards,
};
