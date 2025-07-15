document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    // Cargar cursos aprobados del almacenamiento local, o un Set vacío si no hay nada
    let approvedCourses = new Set(JSON.parse(localStorage.getItem('approvedCourses')) || []);

    // Función para actualizar el estado visual de todos los cursos
    function updateCourseStates() {
        courses.forEach(course => {
            const courseId = course.dataset.id;
            const prerequisites = course.dataset.prerequisites ? course.dataset.prerequisites.split(',') : [];

            // 1. Resetear clases de estado para evitar conflictos
            course.classList.remove('approved', 'prereq-pending', 'can-take');

            // 2. Aplicar clase 'approved' si está en la lista de aprobados
            if (approvedCourses.has(courseId)) {
                course.classList.add('approved');
            } else {
                // 3. Evaluar prerrequisitos si el curso NO está aprobado
                const hasAllPrerequisites = prerequisites.every(prereqId => approvedCourses.has(prereqId));

                if (prerequisites.length > 0 && !hasAllPrerequisites) {
                    // Si tiene prerrequisitos y no los ha cumplido todos
                    course.classList.add('prereq-pending');
                } else if (prerequisites.length === 0 || hasAllPrerequisites) {
                    // Si no tiene prerrequisitos O si los tiene y ya los cumplió
                    course.classList.add('can-take');
                }
            }
        });
    }

    // Cargar el estado inicial al cargar la página
    updateCourseStates();

    // Añadir el evento de clic a cada curso
    courses.forEach(course => {
        course.addEventListener('click', () => {
            const courseId = course.dataset.id;
            const isApproved = approvedCourses.has(courseId);
            const prerequisites = course.dataset.prerequisites ? course.dataset.prerequisites.split(',') : [];
            const hasAllPrerequisites = prerequisites.every(prereqId => approvedCourses.has(prereqId));

            // Lógica para APROBAR o DESAPROBAR un curso
            if (isApproved) {
                // Si el curso ya está aprobado, intentamos desaprobarlo.
                // PERO solo si no es prerrequisito de NINGÚN otro curso ya aprobado.
                let isPrereqForApprovedCourse = false;
                courses.forEach(c => {
                    const cPrereqs = c.dataset.prerequisites ? c.dataset.prerequisites.split(',') : [];
                    if (approvedCourses.has(c.dataset.id) && cPrereqs.includes(courseId)) {
                        isPrereqForApprovedCourse = true;
                    }
                });

                if (isPrereqForApprovedCourse) {
                    alert(`No puedes desaprobar "${course.dataset.name}" (MDN-${courseId.slice(3)}) porque es prerrequisito de otro(s) curso(s) que ya tienes aprobado(s). Debes desaprobar esos cursos primero.`);
                } else {
                    // Si no es prerrequisito de nada aprobado, se puede desaprobar
                    approvedCourses.delete(courseId);
                }

            } else {
                // Si el curso NO está aprobado, intentamos aprobarlo.
                // Solo se puede si no tiene prerrequisitos O si ha cumplido todos.
                if (prerequisites.length === 0 || hasAllPrerequisites) {
                    approvedCourses.add(courseId);
                } else {
                    const missingPrereqs = prerequisites.filter(prereqId => !approvedCourses.has(prereqId));
                    const missingPrereqNames = missingPrereqs.map(id => {
                        const missingCourseElement = document.querySelector(`.course[data-id="${id}"]`);
                        return missingCourseElement ? missingCourseElement.dataset.name : id; // Usar el nombre si existe, sino el ID
                    });
                    alert(`No puedes aprobar "${course.dataset.name}" (MDN-${courseId.slice(3)}) aún. Debes aprobar primero: ${missingPrereqNames.join(', ')}.`);
                }
            }

            // Guardar el estado actualizado en el almacenamiento local del navegador
            localStorage.setItem('approvedCourses', JSON.stringify(Array.from(approvedCourses)));

            // Actualizar el estado visual de todos los cursos después del cambio
            updateCourseStates();
        });
    });
});
