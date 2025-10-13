import { Column, DataType, Model, Table, Default, HasMany } from 'sequelize-typescript';
import Test from './Tests.model';
import Vocabulary from './Vocabulary.Model';
import Exercise from './Exercise.Model';

@Table({
  tableName: 'stories',
})
class Story extends Model {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare idiom: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare phrases: {
    english: string;
    spanish: string;
    startTime: number;
    endTime: number;
  }[];

  @Default([]) 
  @Column({
    type: DataType.JSONB,
    allowNull: false, 
  })
  declare categories: string[];

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_interactive: boolean;

  @Column({
    type: DataType.ENUM('low', 'middle', 'high'), 
    allowNull: false,
  })
  declare level: 'low' | 'middle' | 'high';

  @HasMany(() => Test)
  declare tests: Test[];

  @HasMany(() => Vocabulary)
  declare vocabularies: Vocabulary[];

  @HasMany(() => Exercise)
  declare exercises: Exercise[];
}

export default Story;