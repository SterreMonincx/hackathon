import React from 'react';

export interface SlackConversation {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group' | 'dm';
  unread_count_display: number;
  num_members?: number;
}

interface SlackSidebarProps {
  conversations: SlackConversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  connected: boolean;
  onConnect: () => void;
  loading?: boolean;
}

const typeLabel: Record<SlackConversation['type'], string> = {
  public: 'Public',
  private: 'Private',
  group: 'Group',
  dm: 'DM',
};

const SlackSidebar: React.FC<SlackSidebarProps> = ({
  conversations,
  selectedId,
  onSelect,
  connected,
  onConnect,
  loading = false,
}) => {
  return (
    <aside className="w-72 border-r border-purple-100 bg-white flex flex-col">
      <div className="p-4 border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900">Slack</div>
          {!connected ? (
            <button
              onClick={onConnect}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
            >
              Connect
            </button>
          ) : (
            <span className="text-xs text-green-600">Connected</span>
          )}
        </div>
      </div>
      <div className="p-2 overflow-y-auto flex-1">
        {loading && (
          <div className="text-xs text-gray-500 p-2">Loading conversations…</div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-xs text-gray-500 p-2">No conversations</div>
        )}
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedId === c.id ? 'bg-purple-50' : 'hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-900 truncate">{c.name}</div>
                    <div className="text-[11px] text-gray-500">{typeLabel[c.type]}</div>
                  </div>
                  {c.unread_count_display > 0 && (
                    <span className="text-[11px] bg-purple-600 text-white rounded-full px-2 py-0.5">
                      {c.unread_count_display}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default SlackSidebar;


