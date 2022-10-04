
const commentContainer = document.querySelector('.comments-container');
const inputContainer = document.querySelector('.input-container');
const modal = document.getElementById('modal-container');
let count = 4; // incrementing ids used for new comments
let data
let currentUserName
let currentUserImg

async function fetchData() {
    const response = await fetch('./data.json');
    const obj = await response.json();
    data = obj
    currentUserName = data.currentUser.username;
    currentUserImg = data.currentUser.image.png;
    initialise()
  }

fetchData()

function renderComments(){
    commentContainer.innerHTML = ''; 
    data.comments.sort((a, b) => b.score - a.score); // sort comments by rating
    data.comments.forEach(comment => {
    commentContainer.innerHTML += 
    getCommentHtml('comment',comment ,comment.user.username === currentUserName)
        if (comment.replies.length>0){
            let replies =''
            comment.replies.forEach(reply => {
                replies += 
                getCommentHtml('reply',reply, reply.user.username === currentUserName)
            })
            commentContainer.innerHTML += `<div class="reply-container">${replies}<div/>`
        }
    });

    addEventListeners() // add listeners after new buttons rendered
    saveToLocalStorage(data) // save updated data file to localStorage
}

function initialise(){
    const ls = localStorage.getItem('data')
    data = ls?JSON.parse(ls):data; // overwrite data object with localStorage version if it exists
    inputContainer.innerHTML = getInputHtml('comment', currentUserImg)
    renderComments()

    document.getElementById('add-comment-btn').addEventListener('click',(e)=>{
        addNewComment(document.getElementById('user-input').value);
        renderComments();
        document.getElementById('user-input').value = '';
    });
}


function getInputHtml(type,currentUserImg,to){
    console.log('get inuput html')
    return `
        <div class="new-${type === 'reply'?'reply':'comment'}-input">
            <img src="${currentUserImg}" class="user-image"/>
            <textarea name="" id="user-input" placeholder="Add a comment...">${to?'@'+to+', ':''}</textarea>
            ${type === 'reply'?'<button id="add-reply-btn">Reply</button>':
               '<button id="add-comment-btn">Send</button>'}    
        </div>
        `
}

function getCommentHtml(commentType, commentObj, isCurrent) {
    return `
        <div id="${commentObj.id}" class="${commentType === 'reply'?'comment reply':'comment'}">
            <div class="comment-rating">
                <img src="./images/icon-plus.svg" class="icon score-plus"/>
                <div class="rating-count">${commentObj.score}</div>
                <img src="./images/icon-minus.svg" class="icon score-minus"/>
            </div>
            <div class="comment-body">
                <div class="comment-header">
                    <img class="header-img" src="${commentObj.user.image.png}"/>
                    <div class="header-username">${commentObj.user.username}</div>
                    ${isCurrent?'<div class="header-badge">you</div>':''}
                    <div class="header-date">${commentObj.createdAt}</div>
                </div>
                <div class="comment-controls">
                    ${isCurrent?'<div class="header-delete"><img src="./images/icon-delete.svg" class="icon"/>Delete</div>':''}
                    ${isCurrent?'<div class="header-edit"><img src="./images/icon-edit.svg" class="icon"/>Edit</div>':
                    '<div class="header-reply"><img src="./images/icon-reply.svg" class="icon"/>Reply</div>'}
                    
                </div>
                <div class="comment-text">
                    ${commentType === 'reply'?`<span>@${commentObj.replyingTo}</span>`:''}
                    ${commentObj.content}
                </div>
            </div>
        </div>
    `
}

function postReply(){
    document.getElementById('add-reply-btn').addEventListener('click',(e)=>{
        const commentId = Number(e.target.closest('.input-container').previousElementSibling.id)
        const to = document.querySelector(`#${CSS.escape(commentId)} .header-username`).textContent
        const text = document.querySelector(`.new-reply-input > #user-input`).value
        addReply(text, to, commentId);
        renderComments();
    })
}

function updateVote(id,change){
    data.comments.forEach(comment=>{
        comment.id === id?comment.score+=change:null;
        if (comment.replies.length>0){
            comment.replies.forEach(reply=>{
                reply.id === id?reply.score+=change:null;
            })
        }
    })
    renderComments()
}

function deleteComment(id){
    data.comments = data.comments.filter(comment => {
        if(comment.replies.length === 0 && comment.id != id){
            return comment
        } else if(comment.replies.length > 0 && comment.id != id) {
            comment.replies = comment.replies.filter(reply => reply.id != id)
            return comment
        }
    })
    count--;
    renderComments();
}

function editCommentHtml(id) {
    let currentComment = document.querySelector(`#${CSS.escape(id)} .comment-text`)
    currentComment.innerHTML = `
        <div class="edit-container">
            <textarea name="" id="edit-input" placeholder=".">${currentComment.innerText}</textarea>
            <button id="edit-comment-btn">Update</button>
        </div>
    `
    document.getElementById('edit-comment-btn').addEventListener('click',(e)=>{
        let newText = document.querySelector(`#${CSS.escape(id)} .comment-text textarea`).value
        editComment(Number(e.target.closest('.comment').id),newText)
        console.log('updated')
        renderComments();
    })
}

function addNewComment(text){
    count++
    let newComment = {
        "id": count,
        "content": text,
        "createdAt": "today",
        "score": 0,
        "user": {
          "image": { 
            "png": currentUserImg,
          },
          "username": currentUserName
        },
        "replies": []
    }
    data.comments.push(newComment)
}

function addReply(text, to, id){
    count++
    let newReply = {
        "id": count,
        "content": text.replace(`@${to}, `,''),
        "createdAt": "today",
        "score": 0,
        "replyingTo": to,
        "user": {
          "image": { 
            "png": currentUserImg,
          },
          "username": currentUserName
        }
    }
    data.comments.forEach(comment => { //add reply to comments or replies array
        if(comment.id === id){
            comment.replies.push(newReply)
        }   else if (comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    if(reply.id === id){
                        comment.replies.push(newReply)
                    }
                })   
            }
        }
    )}

function editComment(id, text) { 
data.comments = data.comments.map(comment => {
    if(comment.replies.length === 0 && comment.id != id){   
        return comment
    } 
     else if(comment.replies.length > 0 && comment.id != id) {
        comment.replies = comment.replies.map(reply => {
                if(reply.id === id){
                    return{...reply, content:text.replace(`@${reply.replyingTo} `,'')}
                } else {
                    return reply
                }
            }) 
        return comment     
        }
     else if(comment.id === id) { 
        return comment = {...comment, content:text}
        }
    })
}

function toggleModal(id){
    modal.dataset.refid = id?id:null
    modal.classList.toggle('hidden')
}

function saveToLocalStorage(data){
    localStorage.setItem('data',JSON.stringify(data))
}

// event listeners //

function addEventListeners () {
    // create text input for message reply
    [...document.querySelectorAll('.header-reply')].forEach(el=>el.addEventListener('click',(e)=>{
        const comm = document.getElementById(`${e.target.closest('.comment').id}`)
        const to = document.querySelector(`#${CSS.escape(e.target.closest('.comment').id)} .header-username`).textContent;
        comm.insertAdjacentHTML("afterend", `
            <div class="input-container">
                ${getInputHtml('reply',currentUserImg,to)}
            </div>
        `);
        postReply()
    }));

    // delete comment button
    [...document.querySelectorAll('.header-delete')].forEach(el=>el.addEventListener('click',(e)=>{
        toggleModal(Number(e.target.closest('.comment').id))
        }
    ));

    // up/down vote button
    [...document.querySelectorAll('.comment-rating .icon')].forEach(el=>el.addEventListener('click',(e)=>{
       let commentId = Number(e.target.closest('.comment').id);
       if(e.target.className.includes('score-plus')){updateVote(commentId,1)}
       if(e.target.className.includes('score-minus')){updateVote(commentId,-1)}
    }));

    // edit comment button
    [...document.querySelectorAll('.header-edit')].forEach(el=>el.addEventListener('click',(e)=>{        
        editCommentHtml(e.target.closest('.comment').id)
        }
    ));

}

//modal options
document.getElementById('cancel-btn').addEventListener('click',toggleModal);
document.getElementById('delete-btn').addEventListener('click',(e)=>{
    deleteComment(Number(modal.dataset.refid))
    toggleModal();
});



