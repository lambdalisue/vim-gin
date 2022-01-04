function! gin#get_debug() abort
  call denops#plugin#wait('gin')
  return denops#request('gin', 'debug:get', [])
endfunction

function! gin#set_debug(value) abort
  call denops#plugin#wait('gin')
  return denops#request('gin', 'debug:set', [a:value])
endfunction
