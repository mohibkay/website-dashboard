const container = document.querySelector('.container');
const extensionRequestsContainer = document.querySelector(
  '.extension-requests',
);

const errorHeading = document.querySelector('h2#error');
const modalParent = document.querySelector('.extension-requests-modal-parent');
const closeModal = document.querySelectorAll('#close-modal');

//modal containers
const modalShowInfo = document.querySelector('.extension-requests-info');
const modalStatusForm = document.querySelector(
  '.extension-requests-status-form',
);
const modalUpdateForm = document.querySelector('.extension-requests-form');

const state = {
  currentExtensionRequest: null,
};

const render = async () => {
  try {
    addLoader(container);
    const extensionRequests = await getExtensionRequests();
    const allExtensionRequests = extensionRequests.allExtensionRequests;
    allExtensionRequests.forEach((data) => {
      extensionRequestsContainer.appendChild(createExtensionRequestCard(data));
    });
  } catch (error) {
    errorHeading.textContent = 'Something went wrong';
    errorHeading.classList.add('error-visible');
    reload();
  } finally {
    removeLoader();
  }
};
const showTaskDetails = async (taskId, approved) => {
  if (!taskId) return;
  try {
    modalShowInfo.innerHTML = '<h3>Task Details</h3>';
    addLoader(modalShowInfo);
    const taskDetails = await getTaskDetails(taskId);
    const taskData = taskDetails.taskData;
    modalShowInfo.append(createTaskInfoModal(taskData, approved));
  } catch (error) {
    errorHeading.textContent = 'Something went wrong';
    errorHeading.classList.add('error-visible');
    reload();
  } finally {
    removeLoader();
  }
};
function createTaskInfoModal(data, approved) {
  if (!data) return;

  const dataHeadings = [
    { title: 'Title' },
    { title: 'Ends On', key: 'endsOn', time: true },
    { title: 'Purpose' },
    { title: 'Assignee' },
    { title: 'Created By', key: 'createdBy' },
    { title: 'Is Noteworthy', key: 'isNoteworthy' },
  ];

  const updateStatus = createElement({
    type: 'button',
    attributes: { class: 'status-form' },
    innerText: 'Update Status',
  });
  const closeModal = createElement({
    type: 'button',
    attributes: { id: 'close-modal' },
    innerText: 'Cancel',
  });
  updateStatus.addEventListener('click', () => {
    showModal('status-form');
    fillStatusForm();
  });
  closeModal.addEventListener('click', () => hideModal());

  const main = createTable(dataHeadings, data);

  if (!approved) main.appendChild(updateStatus);
  main.appendChild(closeModal);
  return main;
}
function createExtensionRequestCard(data) {
  if (!data) return;

  const dataHeadings = [
    { title: 'Title' },
    { title: 'Reason' },
    { title: 'Old Ends On', key: 'oldEndsOn', time: true },
    { title: 'New Ends On', key: 'newEndsOn', time: true },
    { title: 'Status', bold: true },
    { title: 'Assignee' },
    { title: 'Created At', key: 'timestamp', time: true },
    { title: 'Task', key: 'taskId' },
  ];

  const updateRequestBtn = createElement({
    type: 'button',
    attributes: { class: 'update_request' },
    innerText: 'Update Request',
  });
  const moreInfoBtn = createElement({
    type: 'button',
    attributes: { class: 'more' },
    innerText: 'More',
  });
  updateRequestBtn.addEventListener('click', () => {
    showModal('update-form');
    state.currentExtensionRequest = data;
    fillUpdateForm();
  });
  moreInfoBtn.addEventListener('click', () => {
    showModal('info');
    showTaskDetails(data.taskId, data.status === 'APPROVED');
    state.currentExtensionRequest = data;
  });

  const main = createTable(dataHeadings, data, 'extension-request');

  main.appendChild(moreInfoBtn);
  main.appendChild(updateRequestBtn);
  return main;
}
render();

//API functions
async function onStatusFormSubmit(e) {
  e.preventDefault();
  try {
    addLoader(container);
    let formData = formDataToObject(new FormData(e.target));
    await updateExtensionRequestStatus({
      id: state.currentExtensionRequest.id,
      body: formData,
    });
    reload();
  } catch (error) {
    errorHeading.textContent = 'Something went wrong';
    errorHeading.classList.add('error-visible');
    reload();
  } finally {
    removeLoader();
  }
}
async function onUpdateFormSubmit(e) {
  e.preventDefault();
  try {
    addLoader(container);
    let formData = formDataToObject(new FormData(e.target));
    formData['newEndsOn'] = new Date(formData['newEndsOn']).getTime() / 1000;
    await updateExtensionRequest({
      id: state.currentExtensionRequest.id,
      body: formData,
    });
    reload();
  } catch (error) {
    errorHeading.textContent = 'Something went wrong';
    errorHeading.classList.add('error-visible');
    reload();
  } finally {
    removeLoader();
  }
}

modalUpdateForm.addEventListener('submit', onUpdateFormSubmit);
modalStatusForm.addEventListener('submit', onStatusFormSubmit);

modalParent.addEventListener('click', hideModal);
closeModal.forEach((node) => node.addEventListener('click', () => hideModal()));

function showModal(show = 'form') {
  modalParent.classList.add('visible');
  modalParent.setAttribute('show', show);
}
function hideModal(e) {
  if (!e) {
    modalParent.classList.remove('visible');
    return;
  }
  e.stopPropagation();
  if (e.target === modalParent) {
    modalParent.classList.remove('visible');
  }
}
function reload() {
  setTimeout(() => window.history.go(0), 2000);
}
function fillStatusForm() {
  modalStatusForm.querySelector('.extensionId').value =
    state.currentExtensionRequest.id;
  modalStatusForm.querySelector('.extensionTitle').value =
    state.currentExtensionRequest.title;
  modalStatusForm.querySelector('.extensionAssignee').value =
    state.currentExtensionRequest.assignee;
}
function fillUpdateForm() {
  modalUpdateForm.querySelector('.extensionNewEndsOn').value = new Date(
    state.currentExtensionRequest.newEndsOn * 1000,
  )
    .toISOString()
    .replace('Z', '');
  modalUpdateForm.querySelector('.extensionOldEndsOn').value = new Date(
    state.currentExtensionRequest.oldEndsOn * 1000,
  )
    .toISOString()
    .replace('Z', '');
  modalUpdateForm.querySelector('.extensionStatus').value =
    state.currentExtensionRequest.status;
  modalUpdateForm.querySelector('.extensionId').value =
    state.currentExtensionRequest.id;
  modalUpdateForm.querySelector('.extensionTitle').value =
    state.currentExtensionRequest.title;
  modalUpdateForm.querySelector('.extensionAssignee').value =
    state.currentExtensionRequest.assignee;
  modalUpdateForm.querySelector('.extensionReason').value =
    state.currentExtensionRequest.reason;
}
