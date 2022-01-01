function! gin#internal#feature#status#core#init() abort
  call gin#internal#feature#action#core#init()
  call gin#internal#feature#reload#core#init()
  call gin#internal#feature#status#action#register()
endfunction

