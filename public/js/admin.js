const socket = io();
let connectionsUsers = [];
let connectionInSupport = []; // Cria uma variável para armazenar os atendimentos

socket.on('admin_list_all_users', connectionsWithoutAdmin => {
  connectionsUsers = connectionsWithoutAdmin;
  document.getElementById('list_users').innerHTML = '';

  let template = document.getElementById('template').innerHTML;
  connectionsWithoutAdmin.forEach(connection => {
    
    const rendered = Mustache.render(template, {
      email: connection.user.email,
      id: connection.socket_id
    })

    document.getElementById('list_users').innerHTML += rendered;
  })
});

function call(socket_id) {
  const connection = connectionsUsers.find(connection => 
    connection.socket_id === socket_id
  )

  // Quando encontrar a conexão, coloca dentro do array de atendido
  connectionInSupport.push(connection);

  const template = document.getElementById('admin_template').innerHTML;

  const rendered = Mustache.render(template, {
    email: connection.user.email,
    id: connection.user.id
  })

  document.getElementById('supports').innerHTML += rendered;

  const params = {
    user_id: connection.user_id
  }

  socket.emit('admin_user_in_support', params);

  socket.emit('admin_list_messages_by_user', params, messages => {
    
    const divMessages = document.getElementById(`allMessages${connection.user_id}`)

    messages.forEach(message => {
      const createDiv = document.createElement('div');

      if (message.admin_id === null) {
        createDiv.className = 'admin_message_client'

        createDiv.innerHTML = `<span>${connection.user.email}</span>`
        createDiv.innerHTML += `<span>${message.text}</span>`
        createDiv.innerHTML += `<span class='admin_date'>${dayjs(message.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>`
      } else {
        createDiv.className = 'admin_message_admin'

        createDiv.innerHTML = `Atendente: <span>${message.text}</span>`
        createDiv.innerHTML += `<span class='admin_date'>${dayjs(message.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>`
      }

      divMessages.appendChild(createDiv)
    })
  })
}

function sendMessage(user_id) {
  const text = document.getElementById(`send_message_${user_id}`)

  const params = {
    text: text.value,
    user_id,
  }

  socket.emit('admin_send_message', params);

  const divMessages = document.getElementById(`allMessages${user_id}`);

  const createDiv = document.createElement('div');
  createDiv.className = 'admin_message_admin'
  createDiv.innerHTML = `Atendente: <span>${params.text}</span>`
  createDiv.innerHTML += `<span class='admin_date'>${dayjs().format('DD/MM/YYYY HH:mm:ss')}</span>`

  divMessages.appendChild(createDiv);

  text.value = '';
}

socket.on('admin_receive_message', data => {
  const connection = connectionInSupport.find(
    (connection) => connection.socket_id === data.socket_id
  );

  const divMessages = document.getElementById(`allMessages${connection.user_id}`)

  const createDiv = document.createElement('div');
  createDiv.className = 'admin_message_client'
  createDiv.innerHTML = `<span>${connection.user.email}</span>`
  createDiv.innerHTML += `<span>${data.message.text}</span>`
  createDiv.innerHTML += `<span class='admin_date'>${dayjs(data.message.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>`

  divMessages.appendChild(createDiv);
})