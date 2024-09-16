import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'

export default class Log extends BaseModel {
  @column({ isPrimary: true })
  public id: number
  
  @hasOne(() => Wallet)
  public account: HasOne<typeof Wallet> 

  @column()
  public accountId: number

  @column()
  public destination: string

  @column()
  public amount: string

  @column()
  public fee: string

  @column()
  public totalAmount: string

  @column()
  public transactionType: string

  @column()
  public result: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
