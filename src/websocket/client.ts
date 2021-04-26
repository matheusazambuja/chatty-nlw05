import { io } from '../http';
import { ConnectionsService } from '../services/ConnectionsService'
import { UsersService } from '../services/UsersService'
import { MessagesService } from '../services/MessagesService'

interface IParams {
  text: string;
  email: string;
}

io.on('connect', (socket) => {
  const connectionsService = new ConnectionsService();
  const usersService = new UsersService();
  const messagesService = new MessagesService();

  socket.on('client_first_access', async params => {
    const socket_id = socket.id;
    const { text, email } = params as IParams;
    let user_id = null;

    // Salvar a conexão com o socket_id e user_id
    const userExists = await usersService.findByEmail(email);

    if (userExists) {
      user_id = userExists.id;
      const connection = await connectionsService.findByUserId(user_id);

      if (!connection) {
        await connectionsService.create({
          socket_id,
          user_id,
        })
      } else {
        connection.socket_id = socket.id;
        await connectionsService.create(connection);
      }
    } else {
      const user = await usersService.create(email);

      await connectionsService.create({
        socket_id,
        user_id: user.id,
      })

      user_id = user.id;
    }

    await messagesService.create({
      text,
      user_id
    });

    const allMessages = await messagesService.listByUser(user_id);

    socket.emit('client_list_all_messages', allMessages);

    const allUser = await connectionsService.findAllWithoutAdmin();
    io.emit('admin_list_all_users', allUser);
  })

  socket.on('client_send_to_admin', async params => {
    const { text, socket_admin_id } = params;

    const socket_id = socket.id

    const { user_id } = await connectionsService.findBySocketId(socket_id);

    const message = await messagesService.create({
      text,
      user_id
    })

    // io: Servidor WebSocket;
    // socket_id: ID da conexão aonde vai ser emitido o evento;
    // Somente essa conexão vai ouvir o evento e executá-lo;
    console.log(socket_admin_id)
    io.to(socket_admin_id).emit('admin_receive_message', {
      message,
      socket_id,
    })
  })

  socket.on('disconnect', async () => {
    console.log(socket.id);
    await connectionsService.deleteBySocketId(socket.id);
  })
})