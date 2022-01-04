function! gin#internal#feature#status#core#init() abort
  call gin#internal#core#action#core#init()
  call gin#internal#core#reload#core#init()
  call gin#internal#feature#status#action#register()
endfunction

