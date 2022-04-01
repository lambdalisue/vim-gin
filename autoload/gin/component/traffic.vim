function! gin#component#traffic#ascii() abort
  let component = 'component:traffic:ascii'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction

function! gin#component#traffic#unicode() abort
  let component = 'component:traffic:unicode'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction
