import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'logs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('account_id').unsigned()
      table.string('destination')
      table.string('amount')
      table.string('fee')
      table.string('total_amount')
      table.string('transaction_type')
      table.enum('result', ['FAILED', 'PENDING', 'SUCCESS']);
      table.foreign('account_id').references('id').inTable('wallets');
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
