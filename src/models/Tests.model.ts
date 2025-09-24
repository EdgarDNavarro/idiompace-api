import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Story from './Story.model';

@Table({
  tableName: 'tests',
})
class Test extends Model {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare ask: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare answer: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare phrase: string;

  @ForeignKey(() => Story)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare storyId: number;

  @BelongsTo(() => Story)
  declare story: Story;
}

export default Test;