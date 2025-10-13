import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Story from './Story.model';

@Table({
  tableName: 'vocabularies',
})
class Vocabulary extends Model {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare vocabulary: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare translation: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare example: string;

  @ForeignKey(() => Story)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare storyId: number;

  @BelongsTo(() => Story)
  declare story: Story;
}

export default Vocabulary;