// associations.ts
// Centralización de todas las asociaciones entre modelos para evitar dependencias circulares en ESM

export async function initAssociations() {
  // Importar modelos dinámicamente DESPUÉS de que estén inicializados
  const { default: Story } = await import('./Story.Model.js');
  const { default: Exercise } = await import('./Exercise.Model.js');
  const { default: Vocabulary } = await import('./Vocabulary.Model.js');
  const { default: Decks } = await import('./Decks.Model.js');
  const { default: Flashcards } = await import('./Flashcards.Model.js');

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
}
