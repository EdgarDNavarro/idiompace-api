import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';

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

  @ForeignKey(() => null)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare storyId: number;
}

export default Vocabulary;