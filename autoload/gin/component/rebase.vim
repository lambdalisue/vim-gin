function! gin#component#rebase#ascii() abort
  let component = 'component:rebase:ascii'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction

function! gin#component#rebase#unicode() abort
  let component = 'component:rebase:unicode'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction
