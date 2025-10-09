import { Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import Decks from './Decks.Model';

@Table({
  tableName: 'flashcards',
})
class Flashcards extends Model {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare front: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare back: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare example: string;

  // ==========================
  // Campos para Spaced Repetition
  // ==========================

  // cuántas veces la has acertado
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare successCount: number;

  // cuántas veces la has fallado
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare failCount: number;

  // intervalo en días (ej. 1, 2, 4, 8…)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare interval: number;

  // factor de facilidad (qué tan fácil/difícil es esta carta)
  @Column({
    type: DataType.FLOAT,
    defaultValue: 2.5, // típico valor inicial en SM-2
  })
  declare easiness: number;

  // última vez que se estudió
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastReviewedAt: Date;

  // próxima vez que debe mostrarse
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare nextReviewAt: Date;

  @ForeignKey(() => Decks)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE'
  })
  declare deckId: number;
}

export default Flashcards;