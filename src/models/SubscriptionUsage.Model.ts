import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'subscription_usages',
})
class SubscriptionUsage  extends Model {
    @Column({
        type: DataType.STRING(200), 
        allowNull: false,
    })
        declare userId: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    declare stripeSubscriptionId: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare storiesUsed: number;

    // Estado de la suscripción en Stripe ("active", "canceled", etc.)
    @Column({
        type: DataType.STRING(100),
        allowNull: false,
    })
    declare status: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    declare priceId: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    declare periodStart: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    declare periodEnd: Date;

}

export default SubscriptionUsage;