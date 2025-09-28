import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'daily',
})
class Daily extends Model {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare phrase: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare phrase_translation: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare example: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare example_translation: string;

}

export default Daily;