import Draggable from 'react-draggable'
import { useRef } from 'react'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'

function StickyNote({ task, members }) {
  const nodeRef = useRef(null)

  const priorityColors = {
    low: '#fef08a',
    medium: '#fed7aa',
    high: '#fecaca'
  }

  const handleDragStop = async (e, data) => {
    await updateDoc(doc(db, 'andes_tm_tasks', task.id), {
      position: { x: data.x, y: data.y }
    })
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: task.position?.x || 0, y: task.position?.y || 0 }}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        style={{ backgroundColor: task.status === 'completed' ? '#d1fae5' : priorityColors[task.priority] }}
        className={`absolute w-56 min-h-40 shadow-lg cursor-grab active:cursor-grabbing p-4 flex flex-col justify-between rounded-sm ${task.status === 'completed' ? 'opacity-75' : ''}`}
      >
        <div>
          <h3 className="font-bold text-gray-800 text-sm leading-tight">{task.title}</h3>
          <p className="text-gray-700 text-xs mt-2">{task.description}</p>
        </div>
        <div className="flex justify-between items-center mt-4 pt-2 border-t border-black/10">
          <span className="text-xs text-gray-600">{members[task.assignedTo] || task.assignedTo}</span>
          <div className="flex items-center gap-2">
            {task.status === 'completed' && (
              <span className="text-xs font-bold text-green-600">✓ Done</span>
            )}
            <span className="text-xs font-bold uppercase text-gray-500">{task.priority}</span>
          </div>
        </div>
      </div>
    </Draggable>
  )
}

export default StickyNote