import { Table, Column, DataType, Model } from 'sequelize-typescript';

@Table({
  tableName: 'streaks',
})
class Streak extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare currentStreak: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare longestStreak: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare userId: string;
}

export default Streak;