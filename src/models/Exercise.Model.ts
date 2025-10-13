import { Table, Column, DataType, Model, BelongsTo, ForeignKey } from 'sequelize-typescript';
import Story from './Story.model';

@Table({
  tableName: 'exercises',
})
class Exercise extends Model {
  @Column({
    type: DataType.STRING(300),
    allowNull: false,
  })
  declare question: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare optionA: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare optionB: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare optionC: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare optionD: string;

  @Column({
    type: DataType.STRING(1),
    allowNull: false,
  })
  declare correctOption: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare explanation: string;

  @ForeignKey(() => Story)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare storyId: number;

  @BelongsTo(() => Story)
  declare story: Story;
}

export default Exercise;