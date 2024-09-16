import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from  '@ioc:Adonis/Core/Validator'
import { Client, Wallet, dropsToXrp, xrpToDrops } from 'xrpl';
import WalletModel from '../../Models/Wallet'
import Env from '@ioc:Adonis/Core/Env'
import Log from 'App/Models/Log';

export default class XrpsController {

    private client: Client;
    
    constructor(){
        this.client = new Client(Env.get('XRPL_ADDRESS'));
    }
    
    async sendXrp({ request, response }: HttpContextContract){
        const vld = schema.create({
            amount: schema.string(),
            destination_address: schema.string(),
            account_seed: schema.string(),
            account_address: schema.string()
        });

        try {
            const payload = await request.validate({ schema: vld });

            await this.client.connect();

            const wallet = Wallet.fromSeed(payload.account_seed);
            
            if(wallet.address !== payload.account_address){
                return response.unprocessableEntity({
                    success: false,
                    message: `The wallet seed doesn't match with wallet address`
                });
            }

            const prepared = await this.client.autofill({
                TransactionType: "Payment",
                Account: wallet.address,
                Amount: xrpToDrops(payload.amount),
                Destination: payload.destination_address
            });

            const signed = wallet.sign(prepared);

            const tx = await this.client.submit(signed.tx_blob);

            const wall = await WalletModel.findBy('address', payload.account_address);
            
            if(wall){
                wall.balance = String(parseFloat(wall.balance) - (parseFloat(payload.amount) + parseFloat(dropsToXrp(tx.result.tx_json.Fee))))
                await wall.save();
            }

            const log = await Log.create({
                accountId: wall?.id,
                destination: payload.destination_address,
                amount: payload.amount,
                fee: String(parseFloat(dropsToXrp(parseInt(tx.result.tx_json.Fee)))),
                totalAmount: String(parseFloat(payload.amount) + parseFloat(dropsToXrp(tx.result.tx_json.Fee))),
                transactionType: "Payment",
                result: "SUCCESS"
            });

            

            if(log){
                return response.created({
                    success: 'True',
                    message: 'Transaction success!'
                });
            }

        } catch (e){
            return response.badRequest({
                success: false,
                message: e.message
            });
        }
    }

    async getAccount({ request, response }: HttpContextContract){
        
        const vld = schema.create({
            account_seed: schema.string(),
            title: schema.string()
        });

        try {
            const payload = await request.validate({ schema: vld });

            await this.client.connect();

            const wallet = Wallet.fromSeed(payload.account_seed);

            const info = await this.client.request({
                command: 'account_info',
                account: wallet.address,
                ledger_index: 'validated'
            });

            const storedWallet = await WalletModel.create({
                title: payload.title,
                publicKey: wallet.publicKey,
                privateKey: wallet.privateKey,
                address: wallet.address,
                seed: wallet.seed,
                balance: String(dropsToXrp(info.result.account_data.Balance)),
                ledgerIndex: info.result.ledger_index,
                ledgerHash: info.result.ledger_hash
            });

            if(storedWallet){
                return response.created({
                    success: true,
                    message: 'Data Stored!'
                });
            }
        } catch (e) {
            return response.badRequest({
                success: false,
                message: e.message
            });
        }
    }

    async getLogs({ request, response }: HttpContextContract){
        try {
            const data = await Log.query().where('account_id', request.param('id'))
            const account = await WalletModel.find(request.param('id'))

            return response.ok({
                data,
                account,
                success: true,
                message: "Data found!"
            });

        } catch (e){
            return response.internalServerError({
                success: false,
                message: e.message
            });
        }
    }

    async getAccounts({ response }: HttpContextContract){
        try {
            const data = await WalletModel.all();
            
            return response.ok({
                success: true,
                data,
                message: "Data found!"
            });

        } catch (e){
            return response.internalServerError({
                success: false,
                message: e.message
            });
        }
    }
}
