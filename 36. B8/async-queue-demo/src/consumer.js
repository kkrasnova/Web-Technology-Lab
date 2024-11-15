const amqp = require('amqplib');

async function consumeMessages() {
    try {
        // Підключення до RabbitMQ
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        const queue = 'tasks_queue';

        // Створюємо чергу
        await channel.assertQueue(queue, {
            durable: true
        });

        console.log(" [*] Очікування повідомлень в %s. Для виходу натисніть CTRL+C", queue);

        // Отримуємо повідомлення
        channel.consume(queue, function(msg) {
            if (msg !== null) {
                console.log(" [x] Отримано %s", msg.content.toString());
                
                // Імітація обробки повідомлення
                const processingTime = Math.random() * 3000;
                setTimeout(() => {
                    console.log(" [✓] Завдання виконано");
                    channel.ack(msg);
                }, processingTime);
            }
        }, {
            noAck: false
        });

    } catch (error) {
        console.error('Помилка:', error);
    }
}

consumeMessages();