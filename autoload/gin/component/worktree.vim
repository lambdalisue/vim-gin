function! gin#component#worktree#name() abort
  let component = 'component:worktree:name'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction

function! gin#component#worktree#full() abort
  let component = 'component:worktree:full'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction
