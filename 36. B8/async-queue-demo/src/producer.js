const amqp = require('amqplib');

async function produceMessages() {
    try {
        // Підключення до RabbitMQ
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        const queue = 'tasks_queue';
        const msg = 'Нове завдання ' + new Date().toISOString();

        // Створюємо чергу
        await channel.assertQueue(queue, {
            durable: true
        });

        // Відправляємо повідомлення
        channel.sendToQueue(queue, Buffer.from(msg), {
            persistent: true
        });

        console.log(" [x] Відправлено '%s'", msg);

        setTimeout(() => {
            connection.close();
            process.exit(0);
        }, 500);

    } catch (error) {
        console.error('Помилка:', error);
    }
}

produceMessages();