export function CaroGameReceiveHandler(msg, socket) {
    const data = JSON.parse(msg);
    switch (data.type) {
        case "request-new-room":

            break;
    }
}