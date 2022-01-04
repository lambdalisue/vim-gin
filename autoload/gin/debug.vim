function! gin#debug#is_enabled() abort
  call denops#plugin#wait('gin')
  return denops#request('gin', 'debug:get', [])
endfunction

function! gin#debug#enable() abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'debug:set', [v:true])
endfunction

function! gin#debug#disable() abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'debug:set', [v:false])
endfunction

function! gin#debug#report(message) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'debug:report', [a:message])
endfunction
