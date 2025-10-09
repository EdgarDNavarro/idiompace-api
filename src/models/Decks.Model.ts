import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import Flashcards from './Flashcards.model';

@Table({
  tableName: 'decks',
})
class Decks extends Model {
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(200), 
    allowNull: false,
  })
  declare userId: string;

  @HasMany(() => Flashcards, {
    onDelete: 'CASCADE',   
    hooks: true,
  })
  declare flashcards: Flashcards[];
}

export default Decks;