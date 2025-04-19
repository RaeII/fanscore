import express, { Application } from "express";
import env from "@/config";
import loaders from "@/loaders";
import DatabaseConnectionManager from './services/DatabaseConnectionManager';

async function testDatabaseConnection(): Promise<boolean> {	
    try {
        DatabaseConnectionManager.initialize();
        
        // Testa a conexão executando uma consulta simples
        return await DatabaseConnectionManager.runWithConnection(async () => {
            const connection = await DatabaseConnectionManager.getConnection();
            const [result] = await connection.query('SELECT 1 AS connectionTest');
            console.log('✅ MYSQL - Conexão testada com sucesso');
            return true;
        });
    } catch (error) {
        console.error('❌ MYSQL - Falha na conexão', error);
        return false;
    }
}

async function startServer() {
	const app: Application = express();
	await testDatabaseConnection();

	await loaders(app);
	const server = app.listen(env.PORT, () => {
		console.log(`
			##############################
			Server listening on port: ${env.PORT}
			##############################`);
	}).on("error", (err: any) => {
		console.log(err);
		process.exit(1);
	});

}

startServer();