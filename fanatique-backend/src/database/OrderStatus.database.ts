/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';

class OrderStatusDatabase extends Database {
    async update(data: any, id: number) {
        // Filtra valores undefined
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        );
        
        const mysqlBind = createBindParams(filteredData);

        return await this.query(`UPDATE order_status SET ${mysqlBind} WHERE id = ?;`, [...Object.values(filteredData), id]);
    }

}

export default OrderStatusDatabase; 