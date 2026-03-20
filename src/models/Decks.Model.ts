import { Column, DataType, Model, Table } from 'sequelize-typescript';



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
}

export default Decks;