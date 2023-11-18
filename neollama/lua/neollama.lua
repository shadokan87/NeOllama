-- This file can be loaded by calling `lua require('plugins')` from your init.vim
-- Only required if you have packer configured as `opt`
print("Hello neollama")
function getSelectedText()
    local _, csrow, cscol, _ = unpack(vim.fn.getpos("'<"))
    local _, cerow, cecol, _ = unpack(vim.fn.getpos("'>"))
    local lines = vim.api.nvim_buf_get_lines(0, csrow - 1, cerow, false)
    if #lines == 0 then
        return ''
    end
    lines[1] = string.sub(lines[1], cscol)
    lines[#lines] = string.sub(lines[#lines], 1, cecol)
    return table.concat(lines, '\n')
end

function highlightLine(lineNumber, color)
    vim.api.nvim_command('highlight Search guifg=NONE guibg=' .. color)
    vim.fn.matchaddpos('Search', {lineNumber})
end

function promptCallback(text, selectedText)
    print('[TEXT] ' .. text)
    print('[SELECTED]', selectedText)

    local http_request = require "http.request"
    local headers = {
        ["Content-Type"] = "application/json"
    }
    local body = string.format('{ "content": %s, "selectedText": %s }', vim.fn.json_encode(text),
        vim.fn.json_encode(selectedText))
    local req = http_request.new_from_uri("http://localhost:3000/prompt")
    req.headers:upsert(":method", "POST")
    req.headers:upsert(":scheme", "http")
    req.headers:upsert(":path", "/prompt")
    for k, v in pairs(headers) do
        req.headers:upsert(k, v)
    end
    print('[BODY]' .. body)
    req:set_body(body)
    local headers, stream = req:go() -- Added timeout of 2 seconds
    local body = stream:get_body_as_string()
    if headers:get ":status" ~= "200" then
        print("HTTP request failed with status: " .. headers:get ":status")
    else
        print("HTTP request successful. Response: " .. body)
    end
end

function showPrompt()
    -- local lineNumber = vim.fn.line('.')
    -- highlightLine(lineNumber, 'red')
    -- local selectedText = getSelectedText()
    vim.ui.input({
        prompt = "Enter some text: ",
        completion = "file"
    }, function(text)
        promptCallback(text, selectedText)
    end)
end

vim.api.nvim_set_keymap('n', '<leader>k', ':lua showPrompt()<CR>', {
    noremap = true,
    silent = true
})
vim.api.nvim_set_keymap('v', '<leader>k', ':lua showPrompt()<CR>', {
    noremap = true,
    silent = true
})
vim.api.nvim_set_keymap('s', '<leader>k', ':lua showPrompt()<CR>', {
    noremap = true,
    silent = true
})
-- vim.api.nvim_set_keymap('n', '<leader>k', :wshowPrompt(), {noremap = true, silent = true})
