// 1. Registrar el Service Worker (Esto sí puede ir fuera)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then((registration) => {
            console.log('Service Worker registrado con éxito:', registration);
        })
        .catch((error) => {
            console.error('Error al registrar el Service Worker:', error);
        });
}

// 2. Esperamos a que el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {

    // --- Todo tu código ahora va aquí dentro ---

    // 2. Referencias del DOM
    const db = new PouchDB('tareas');
    const inputName = document.getElementById('nombre');
    const inputFecha = document.getElementById('fecha');
    const btnAdd = document.getElementById('btnAdd');
    const listaTareasEl = document.getElementById('lista-tareas'); // El <ul>

    const listarTareas = () => {
        db.allDocs({
            include_docs: true,
            descending: true // Muestra las más nuevas primero
        })
        .then((result) => {
            // Limpiamos la lista actual
            listaTareasEl.innerHTML = '';
            
            // Iteramos sobre cada documento (tarea)
            result.rows.forEach((row) => {
                const tarea = row.doc;

                // Creamos el elemento <li> de Bootstrap
                const li = document.createElement('li');
                li.className = `list-group-item d-flex justify-content-between align-items-center ${tarea.completada ? 'list-group-item-light text-decoration-line-through' : ''}`;
                
                // Contenido de la tarea (nombre y fecha)
                li.innerHTML = `
                    <div>
                        <strong>${tarea.nombre}</strong><br>
                        <small class="text-muted">Fecha: ${tarea.fecha || 'Sin fecha'}</small>
                    </div>
                    <div>
                        <button class="btn ${tarea.completada ? 'btn-warning' : 'btn-success'} btn-sm btn-completar" data-id="${tarea._id}">
                            ${tarea.completada ? '↩' : '✓'}
                        </button>
                        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${tarea._id}">
                            ×
                        </button>
                    </div>
                `;
                
                // Añadimos el <li> al <ul>
                listaTareasEl.appendChild(li);
            });
        }).catch((err) => {
            console.error('Error al listar tareas:', err);
        });
    };

    /**
     * Event Listener para AGREGAR una nueva tarea
     */
    btnAdd.addEventListener('click', () => {
        if (inputName.value === '') {
            alert('El nombre de la tarea no puede estar vacío.');
            return;
        }

        const tarea = {
            _id: new Date().toISOString(),
            nombre: inputName.value,
            fecha: inputFecha.value,
            completada: false // Nuevo estado: 'completada'
        };

        db.put(tarea).then((result) => {
            console.log('Tarea agregada', result);
            inputName.value = '';
            inputFecha.value = '';
            listarTareas(); // Actualizamos la lista
        }).catch((err) => {
            console.log('Error al agregar:', err);
        });
    });

    /**
     * Event Listener para COMPLETAR o ELIMINAR (Usando delegación de eventos)
     */
    listaTareasEl.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.getAttribute('data-id');
        
        if (!id) return; // Se hizo clic en otra parte

        // --- Acción: COMPLETAR / DESMARCAR TAREA ---
        if (target.classList.contains('btn-completar')) {
            db.get(id).then((doc) => {
                // Cambia el estado de 'completada'
                doc.completada = !doc.completada; 
                return db.put(doc); // Guarda el documento actualizado
            }).then(() => {
                listarTareas(); // Actualiza la vista
            }).catch((err) => {
                console.error('Error al completar:', err);
            });
        }

        // --- Acción: ELIMINAR TAREA ---
        if (target.classList.contains('btn-eliminar')) {
            // Confirmación
            if (!confirm('¿Estás seguro de que deseas eliminar esta tarea permanentemente?')) {
                return;
            }

            db.get(id).then((doc) => {
                return db.remove(doc); // Elimina el documento
            }).then(() => {
                listarTareas(); // Actualiza la vista
            }).catch((err) => {
                console.error('Error al eliminar:', err);
            });
        }
    });

    // 5. Carga inicial de tareas al abrir la app
    listarTareas();

}); // <-- FIN DEL 'DOMContentLoaded'