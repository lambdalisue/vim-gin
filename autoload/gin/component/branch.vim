function! gin#component#branch#ascii() abort
  let component = 'component:batch:ascii'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction

function! gin#component#branch#unicode() abort
  let component = 'component:batch:unicode'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction
